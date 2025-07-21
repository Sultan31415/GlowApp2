# 🧠 AZURE OPENAI SETUP GUIDE

## 🎯 **Current Issues**

Your application is working but has two issues:

1. **Azure OpenAI Deployment Not Found**: The embedding service can't find the deployment
2. **Response Validation Error**: DateTime fields need to be converted to strings

## ✅ **Fixes Applied**

### **1. Fixed Response Validation Error**
- ✅ Updated `/api/me` endpoint to return `created_at` as ISO string
- ✅ Updated `/api/refresh-user` endpoint to return `created_at` as ISO string

### **2. Added Embedding Deployment Configuration**
- ✅ Added `AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME` to settings
- ✅ Updated embedding service to use the configured deployment name

## 🔧 **Required Environment Variables**

Add these to your `.env` file in the `back/` directory:

```env
# Azure OpenAI Configuration (Required for vector embeddings)
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Azure OpenAI Deployment Names (Required)
AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT_NAME=gpt-4o-mini
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-3-small

# Database Configuration
DATABASE_URL=postgresql://glowuser:glowpassword@localhost:5433/glowdb

# Authentication Configuration
CLERK_SECRET_KEY=your_clerk_secret_key_here
JWT_KEY=your_jwt_key_here
```

## 🚀 **Azure OpenAI Setup Steps**

### **1. Create Azure OpenAI Resource**
1. Go to Azure Portal
2. Create a new "Azure OpenAI" resource
3. Choose your region and pricing tier
4. Wait for deployment to complete

### **2. Deploy Required Models**
In your Azure OpenAI resource, deploy these models:

#### **GPT-4o Models**
- **Deployment Name**: `gpt-4o`
- **Model**: `gpt-4o`
- **Version**: `2024-05-13`

- **Deployment Name**: `gpt-4o-mini`
- **Model**: `gpt-4o-mini`
- **Version**: `2024-07-18`

#### **Embedding Model**
- **Deployment Name**: `text-embedding-3-small`
- **Model**: `text-embedding-3-small`
- **Version**: `2024-05-15`

### **3. Get Your Credentials**
1. Go to "Keys and Endpoint" in your Azure OpenAI resource
2. Copy the endpoint URL
3. Copy one of the API keys

### **4. Update Your .env File**
Replace the placeholder values with your actual credentials:

```env
AZURE_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_GPT4O_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT_NAME=gpt-4o-mini
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-3-small
```

## 🔄 **Restart Application**

After updating your `.env` file:

```bash
# Restart the containers
docker compose down
docker compose up --build
```

## ✅ **Verification**

Once configured, you should see these logs:

```
[EmbeddingService] Using Azure OpenAI: text-embedding-3-small
[VectorSearch] Saved message with embedding: user | Type: greeting | Sentiment: 0.5
```

## 🆘 **Fallback Mode**

If Azure OpenAI is not available, the system will:
- ✅ Use regular OpenAI (if `OPENAI_API_KEY` is set)
- ✅ Store embeddings in JSONB field
- ✅ Use Python-based similarity calculations
- ✅ Continue working with reduced performance

## 🎯 **Current Status**

- ✅ **Application starts successfully**
- ✅ **Database schema is correct**
- ✅ **Vector features work in fallback mode**
- ✅ **Response validation errors fixed**
- ⚠️ **Azure OpenAI needs configuration for full functionality**

**Once you configure Azure OpenAI, Leo will have full vector memory capabilities!** 🧠✨ 