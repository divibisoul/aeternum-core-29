FROM python:3.11-slim
ARG TRANSFORMERS_SHA=6f2e80bdad560947903bb4bde8043ae95387069a
ARG PYTORCH_SHA=a84b7baa33f893ab92176c08a85b14455e60b2fc
ENV PYTHONUNBUFFERED=1 PIP_DISABLE_PIP_VERSION_CHECK=1 TRANSFORMERS_NO_TF=1 USE_TF=0 USE_FLAX=0
ENV TRANSFORMERS_SOURCE_SHA=$TRANSFORMERS_SHA PYTORCH_SOURCE_SHA=$PYTORCH_SHA
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates build-essential && rm -rf /var/lib/apt/lists/*
RUN git init /opt/transformers \
 && git -C /opt/transformers remote add origin https://github.com/huggingface/transformers.git \
 && git -C /opt/transformers -c protocol.version=2 fetch --depth=1 --filter=blob:none origin "$TRANSFORMERS_SHA" \
 && git -C /opt/transformers checkout --detach FETCH_HEAD \
 && test "$(git -C /opt/transformers rev-parse HEAD)" = "$TRANSFORMERS_SHA"
RUN git init /opt/pytorch \
 && git -C /opt/pytorch remote add origin https://github.com/pytorch/pytorch.git \
 && git -C /opt/pytorch -c protocol.version=2 fetch --depth=1 --filter=blob:none origin "$PYTORCH_SHA" \
 && test "$(git -C /opt/pytorch rev-parse FETCH_HEAD)" = "$PYTORCH_SHA"
RUN python -m pip install --no-cache-dir --upgrade pip \
 && python -m pip install --no-cache-dir torch==2.7.1 --index-url https://download.pytorch.org/whl/cpu \
 && python -m pip install --no-cache-dir numpy requests packaging pyyaml regex tqdm filelock huggingface-hub tokenizers safetensors \
 && python -m pip install --no-cache-dir --no-deps -e /opt/transformers \
 && python -c "import importlib.util; assert all(importlib.util.find_spec(x) is None for x in ('tensorflow','jax','flax'))"
WORKDIR /app
COPY infer.py /app/infer.py
COPY generate.py /app/generate.py
EXPOSE 18071 18072
CMD ["python","/app/infer.py","--serve"]
