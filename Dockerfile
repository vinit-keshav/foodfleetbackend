# Step 1: Use an official Node.js 18 runtime as the base image (supports newer JS syntax)
FROM node:18

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy package.json and package-lock.json into the container
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy the entire backend code into the container
COPY . .

# Step 6: Expose the port on which the backend is running
EXPOSE 8000

# Step 7: Define environment variables (optional, these will be provided at runtime)
ENV NODE_ENV=production

# Step 8: Start the backend server
CMD ["npm", "start"]

