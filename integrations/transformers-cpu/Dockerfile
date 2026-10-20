FROM python:3.11-slim
ARG TRANSFORMERS_SHA=6f2e80bdad560947903bb4bde8043ae95387069a
ARG PYTORCH_SHA=a84b7baa33f893ab92176c08a85b14455e60b2fc
ENV PYTHONUNBUFFERED=1 PIP_DISABLE_PIP_VERSION_CHECK=1 TRANSFORMERS_NO_TF=1 USE_TF=0 USE_FLAX=0
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && git clone --filter=blob:none https://github.com/huggingface/transformers.git /opt/transformers \
    && git -C /opt/transformers checkout --detach "${TRANSFORMERS_SHA}" \
    && test "$(git -C /opt/transformers rev-parse HEAD)" = "${TRANSFORMERS_SHA}" \
    && git clone --filter=blob:none https://github.com/pytorch/pytorch.git /opt/pytorch \
    && git -C /opt/pytorch checkout --detach "${PYTORCH_SHA}" \
    && test "$(git -C /opt/pytorch rev-parse HEAD)" = "${PYTORCH_SHA}"
RUN python -m pip install --no-cache-dir --pre torch --index-url https://download.pytorch.org/whl/nightly/cpu
RUN python -m pip install --no-cache-dir numpy requests packaging pyyaml regex tqdm filelock huggingface-hub tokenizers safetensors \
    && python -m pip install --no-cache-dir --no-deps -e /opt/transformers
ENV TRANSFORMERS_SOURCE_SHA=${TRANSFORMERS_SHA} PYTORCH_SOURCE_SHA=${PYTORCH_SHA}
WORKDIR /app
COPY infer.py /app/infer.py
CMD ["python","/app/infer.py"]
