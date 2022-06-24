FROM node:18.4.0-alpine3.15 
RUN mkdir -p /home/my-project
WORKDIR /home/my-project
COPY . ./
RUN npm install
CMD ["npm", "run", "dev"]