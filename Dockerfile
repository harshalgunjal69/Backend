FROM node:18-alpine

# Creating a directory for the app
WORKDIR /app

# Copying package.json file
COPY package.json .

# Installing node modules
RUN npm install

# Copying the source code
COPY . .

# Building the source code
RUN npm run build

# Exposing the port
EXPOSE 8080

# Running the app
CMD [ "npm", "run", "preview" ]
