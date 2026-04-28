# Use an official Python runtime as a parent image
# We use the torch image as a base because Demucs requires it, saving installation time
FROM pytorch/pytorch:2.2.1-cuda12.1-cudnn8-runtime

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy the current directory contents into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY stems_server.py .

# Set environment variables
# Hugging Face Spaces expects port 7860
ENV PORT=7860
ENV PYTHONUNBUFFERED=1

# Create the uploads directory and ensure permissions
RUN mkdir -p public/uploads/stems && chmod -R 777 public

# Expose the port
EXPOSE 7860

# Run gunicorn when the container launches
CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:7860", "stems_server:app", "--timeout", "900"]
