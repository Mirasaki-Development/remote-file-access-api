FROM node:19

# Create app/working directory
RUN mkdir -p /app
WORKDIR /app

# Install app development dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm install --include=dev

# Bundle app source
COPY . ./

# API port
EXPOSE 9000

# Show current folder structure in logs
# RUN ls -al -R

# Run the dev command
CMD [ "npm", "run", "dev" ]
