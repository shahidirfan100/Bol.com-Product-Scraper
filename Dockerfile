FROM apify/actor-node:24

COPY --chown=myuser package*.json ./
RUN npm --quiet set progress=false \
    && npm install --omit=dev --no-audit --no-fund \
    && echo "Installed NPM packages:" \
    && (npm list --omit=dev --all || true)

COPY --chown=myuser . ./

ENV APIFY_LOG_LEVEL=INFO

CMD npm start --silent
