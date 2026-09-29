# RGO → HortaCore N01

Capacidade: rgo.hortacore.store@1.0.0.

O N01 permanece dono do HortaCore existente. O RGO não cria outra memória.

Cada etapa contém finding_id, cycle_id, sequence_index, stage, scale, parent_hash, input_hash, output_hash, status, ERU snapshot hash e RGO evidence chain hash.

O armazenamento usa uma chave formada pelo ciclo, finding e hash da etapa para preservar histórico e evitar sobrescrita destrutiva.

A transmissão ocorre pelo Soul Mesh já existente. O Vagus fica reservado à observabilidade/eventos locais.