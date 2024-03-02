FROM node:18-alpine

# Creating a directory for the app
WORKDIR /app

# Copying package.json file
COPY package*.json .

# Installing node modules
RUN npm install

# Copying the source code
COPY . .

# Exposing the port
EXPOSE 8000

# Running the app
CMD [ "npm", "run", "start" ]
