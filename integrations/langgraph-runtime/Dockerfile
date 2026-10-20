FROM python:3.11-slim
ARG LANGGRAPH_SHA=1400d25b7b88cfa055c55b8a82bd95b7c25caef1
ENV PYTHONUNBUFFERED=1 PIP_DISABLE_PIP_VERSION_CHECK=1 LANGGRAPH_UPSTREAM_SHA=${LANGGRAPH_SHA}
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && git clone https://github.com/langchain-ai/langgraph.git /opt/langgraph \
    && git -C /opt/langgraph checkout --detach "${LANGGRAPH_SHA}" \
    && test "$(git -C /opt/langgraph rev-parse HEAD)" = "${LANGGRAPH_SHA}" \
    && python -m pip install --no-cache-dir -e /opt/langgraph/libs/langgraph
WORKDIR /app
COPY server.py /app/server.py
EXPOSE 18070
CMD ["python","/app/server.py"]
