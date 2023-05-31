# Install the base php image
FROM alpine
WORKDIR /app/

# Install required packages
RUN apk update
RUN apk add inotify-tools npm
RUN apk add php php-common php-mysqli php-json php-curl php-session

# Install dependencies
COPY . .
RUN npm install
RUN npm run build

# Start the dev server
CMD npm run watch & php -S 0.0.0.0:8000 && fg
