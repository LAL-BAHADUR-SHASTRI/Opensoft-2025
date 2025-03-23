FROM node:16-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000

# Change this line to use the Vite dev command
CMD ["npm", "run", "dev"]