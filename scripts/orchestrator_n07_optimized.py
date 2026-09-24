#!/usr/bin/env python3
"""
Orquestrador Neural Otimizado para o N07 (Neocórtex Pré-frontal)
Com suporte a GPU, roteamento dinâmico e metacognição (aprendizado por reforço).
"""

import os
import sys
import json
import time
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from collections import deque
import requests
from supabase import create_client
import openai
import google.generativeai as genai

# ============================================================
# CONFIGURAÇÃO
# ============================================================
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[N07] Dispositivo: {DEVICE}")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BYOK_KEY = os.getenv("BYOK_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# URLs dos núcleos (injetados via variáveis de ambiente)
NUCLEOS = {
    "N01": os.getenv("NUCLEO_N01"),
    "N02": os.getenv("NUCLEO_N02"),
    "N03": os.getenv("NUCLEO_N03"),
    "N04": os.getenv("NUCLEO_N04"),
    "N05": os.getenv("NUCLEO_N05"),
    "N06": os.getenv("NUCLEO_N06"),
    "N07": os.getenv("NUCLEO_N07"),  # ele mesmo, mas para consistência
}

# ============================================================
# 1. ROTEADOR NEURAL (com GPU)
# ============================================================
class NeuralRouter(nn.Module):
    """
    Roteador baseado em embeddings. Mapeia uma tarefa (embedding) para
    uma distribuição de probabilidade sobre os núcleos.
    """
    def __init__(self, input_dim=768, hidden_dim=512, num_cores=7):
        super().__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.fc3 = nn.Linear(hidden_dim, num_cores)
        self.dropout = nn.Dropout(0.2)
        self.num_cores = num_cores

    def forward(self, x):
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = F.relu(self.fc2(x))
        x = self.fc3(x)
        return F.softmax(x, dim=-1)

# ============================================================
# 2. MEMÓRIA DE EXPERIÊNCIAS (para metacognição)
# ============================================================
class ExperienceMemory:
    """
    Armazena experiências (tarefa, roteamento escolhido, recompensa)
    para aprender a melhorar o roteamento.
    """
    def __init__(self, capacity=1000):
        self.buffer = deque(maxlen=capacity)

    def add(self, task_embedding, chosen_cores, reward=None):
        self.buffer.append((task_embedding, list(chosen_cores), reward))

    def pending_index(self):
        for index in range(len(self.buffer) - 1, -1, -1):
            if self.buffer[index][2] is None:
                return index
        return None

    def sample(self, batch_size=32, num_cores=7):
        ready = [item for item in self.buffer if item[2] is not None]
        if len(ready) < batch_size:
            return None
        indices = np.random.choice(len(ready), batch_size, replace=False)
        batch = [ready[i] for i in indices]
        tasks = torch.tensor([b[0] for b in batch], dtype=torch.float32)
        masks = torch.zeros((batch_size, num_cores), dtype=torch.float32)
        for row, item in enumerate(batch):
            for core_idx in item[1]:
                if 0 <= core_idx < num_cores:
                    masks[row, core_idx] = 1.0
        rewards = torch.tensor([float(b[2]) for b in batch], dtype=torch.float32)
        return tasks.to(DEVICE), masks.to(DEVICE), rewards.to(DEVICE)

# ============================================================
# 3. ORQUESTRADOR PRINCIPAL
# ============================================================
class SOULOrchestrator:
    def __init__(self):
        from sentence_transformers import SentenceTransformer
        model_name = os.getenv("N07_EMBEDDING_MODEL", "all-MiniLM-L6-v2")
        self.embedder = SentenceTransformer(model_name)
        embedding_dim = self.embedder.get_sentence_embedding_dimension()
        if not isinstance(embedding_dim, int) or embedding_dim <= 0:
            raise RuntimeError("EMBEDDER_INVALID_DIMENSION")
        self.embedding_dim = embedding_dim
        self.router = NeuralRouter(input_dim=embedding_dim, num_cores=len(NUCLEOS)).to(DEVICE)
        self.optimizer = torch.optim.Adam(self.router.parameters(), lr=1e-4)
        self.memory = ExperienceMemory(capacity=2000)
        self.supabase = None
        if SUPABASE_URL and SUPABASE_KEY:
            self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        # O embedding deve vir de um modelo real carregado acima; ausência do modelo
        # encerra a execução em vez de criar uma representação artificial.
        if OPENAI_API_KEY:
            openai.api_key = OPENAI_API_KEY
        if GEMINI_API_KEY:
            genai.configure(api_key=GEMINI_API_KEY)

    def embed_task(self, task_text):
        """Gera embedding real com o modelo carregado."""
        if not isinstance(task_text, str) or not task_text.strip():
            raise ValueError("TASK_TEXT_REQUIRED")
        embedding = self.embedder.encode(
            task_text,
            convert_to_tensor=True,
            normalize_embeddings=True,
        ).detach().cpu().numpy().astype(np.float32)
        if embedding.ndim != 1 or embedding.shape[0] != self.embedding_dim:
            raise RuntimeError(
                f"EMBEDDER_DIMENSION_MISMATCH:{embedding.shape[0]}!={self.embedding_dim}"
            )
        return embedding

    def route_task(self, task_embedding):
        """Escolhe os núcleos a ativar com base no embedding."""
        with torch.no_grad():
            tensor = torch.tensor(task_embedding, dtype=torch.float32).to(DEVICE)
            probs = self.router(tensor.unsqueeze(0)).squeeze(0)
            # Seleciona todos os núcleos acima do limiar; se nenhum, usa o máximo observado.
            threshold = 0.15
            selected = (probs > threshold).nonzero(as_tuple=True)[0].tolist()
            if not selected:  # fallback: pega o mais provável
                selected = [torch.argmax(probs).item()]
            return selected, probs.cpu().numpy()

    def call_core(self, core_name, task_payload):
        """Chama um núcleo via HTTP e retorna a resposta observada."""
        url = NUCLEOS.get(core_name)
        if not url:
            return {"error": f"URL de {core_name} não configurada"}
        try:
            resp = requests.post(f"{url}/process", json=task_payload, timeout=10)
            if resp.status_code == 200:
                return resp.json()
            else:
                return {"error": f"Status {resp.status_code}"}
        except Exception as e:
            return {"error": str(e)}

    def orchestrate(self, task_text):
        """Pipeline completo: embedding -> roteamento -> chamada -> agregação."""
        # 1. Embedding
        emb = self.embed_task(task_text)
        # 2. Roteamento
        selected_cores, probs = self.route_task(emb)
        # 3. Despacho sequencial determinístico (cada chamada é real ou retorna erro explícito)
        results = {}
        for core_idx in selected_cores:
            core_name = f"N{core_idx+1:02d}"
            payload = {"task": task_text, "context": emb.tolist()}
            results[core_name] = self.call_core(core_name, payload)
        # 4. Agregar resultados (exemplo: síntese com LLM externo)
        aggregated = self.synthesize(task_text, results)
        # 5. Registrar experiência pendente; nenhuma recompensa é inventada.
        self.memory.add(emb.tolist(), selected_cores, None)
        return {
            "task": task_text,
            "routed_cores": [f"N{idx+1:02d}" for idx in selected_cores],
            "probabilities": probs.tolist(),
            "results": results,
            "aggregated": aggregated
        }

    def synthesize(self, task_text, results):
        """Sintetiza os resultados parciais usando um LLM externo (OpenAI/Gemini) ou concatenação."""
        # Monta um resumo dos resultados
        summary = "\n".join([f"{k}: {v}" for k, v in results.items()])
        prompt = f"Tarefa: {task_text}\nResultados parciais:\n{summary}\nForneça uma resposta consolidada e coerente."
        # Tenta usar OpenAI
        synthesis_errors = []
        if OPENAI_API_KEY:
            try:
                response = openai.ChatCompletion.create(
                    model=os.getenv("OPENAI_MODEL", "gpt-4"),
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=300
                )
                return response.choices[0].message.content
            except Exception as exc:
                synthesis_errors.append(f"openai:{type(exc).__name__}:{exc}")
        # Fallback para Gemini
        if GEMINI_API_KEY:
            try:
                model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-pro"))
                response = model.generate_content(prompt)
                return response.text
            except Exception as exc:
                synthesis_errors.append(f"gemini:{type(exc).__name__}:{exc}")
        # Fallback final: resultado bruto observado, sem alegar síntese LLM.
        if synthesis_errors:
            return json.dumps({
                "status": "SYNTHESIS_FALLBACK",
                "errors": synthesis_errors,
                "observed_results": results,
            }, ensure_ascii=False)
        return summary

    def meta_learn(self, feedback_reward):
        """
        Metacognição: atualiza o roteador com base no feedback (recompensa) da última tarefa.
        Usa aprendizado por reforço simples (policy gradient) para ajustar os pesos.
        """
        feedback = float(feedback_reward)
        if not np.isfinite(feedback):
            raise ValueError("feedback_reward deve ser finito")
        index = self.memory.pending_index()
        if index is None:
            return {"status": "NO_PENDING_EXPERIENCE"}
        task_emb, chosen_cores, _ = self.memory.buffer[index]
        self.memory.buffer[index] = (task_emb, chosen_cores, feedback)

        batch = self.memory.sample(batch_size=32, num_cores=len(NUCLEOS))
        if batch is None:
            return {
                "status": "PENDING_BATCH",
                "ready_experiences": sum(item[2] is not None for item in self.memory.buffer),
            }
        tasks, masks, rewards = batch
        probabilities = self.router(tasks)
        chosen_probability = torch.sum(probabilities * masks, dim=1).clamp_min(1e-8)
        loss = -torch.mean(rewards * torch.log(chosen_probability))
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()
        print(f"[Metacognição] Loss atualizada: {loss.item():.4f}")
        return {"status": "UPDATED", "loss": float(loss.item()), "feedback": feedback, "batch_size": int(len(rewards))}

# ============================================================
# 4. PONTO DE ENTRADA (para testes/execução)
# ============================================================
if __name__ == "__main__":
    orchestrator = SOULOrchestrator()
    # Exemplo de tarefa
    test_task = "Resuma as principais características do SOUL e sugira melhorias."
    print(f"[N07] Processando tarefa: {test_task}")
    result = orchestrator.orchestrate(test_task)
    print(json.dumps(result, indent=2))
    # Simula um feedback de sucesso (ex: 1.0 = bom, -1.0 = ruim)
    # Aqui, em produção, viria de uma avaliação externa.
    if os.getenv("N07_FEEDBACK_REWARD") is not None:
        orchestrator.meta_learn(float(os.environ["N07_FEEDBACK_REWARD"]))
        print("[N07] Metacognição aplicada com feedback externo.")
    else:
        print("[N07] Metacognição aguardando feedback externo; nenhuma recompensa foi inventada.")
