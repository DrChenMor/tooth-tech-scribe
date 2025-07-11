# Instagram Social Media Posting Setup Guide

## 🔧 Why the Social Media Function Isn't Working

The social media posting function is **not working** because it requires proper Instagram Business Account credentials that need to be configured. Here's how to fix it:

## 📋 Prerequisites

1. **Facebook Business Manager Account**
2. **Instagram Business Account** (connected to your Facebook Page)
3. **Facebook App** with Instagram Basic Display permissions

## 🚀 Step-by-Step Setup

### Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App"
3. Choose "Business" as the app type
4. Fill in your app details
5. Add "Instagram Basic Display" product to your app

### Step 2: Get Instagram Business Account ID

1. Go to [Facebook Business Manager](https://business.facebook.com/)
2. Navigate to "All Tools" → "Instagram accounts"
3. Find your Instagram Business Account
4. Copy the Instagram Business Account ID (it's a long number)

### Step 3: Generate Page Access Token

1. Go to [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the dropdown
3. Add these permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
4. Click "Generate Access Token"
5. Copy the generated token

### Step 4: Update the Code

Replace the placeholder values in `src/components/SocialPostModal.tsx`:

```typescript
// Replace these lines:
const instagramAccountId = 'YOUR_INSTAGRAM_BUSINESS_ACCOUNT_ID';
const pageAccessToken = 'YOUR_PAGE_ACCESS_TOKEN';

// With your actual values:
const instagramAccountId = '123456789012345'; // Your actual Instagram Business Account ID
const pageAccessToken = 'EAABwzLixnjYBO...'; // Your actual Page Access Token
```

## 🧪 Testing the Function

### Option 1: Test with Real Credentials

1. Follow the setup steps above
2. Update the code with your real credentials
3. Try posting from the admin panel

### Option 2: Test Function Accessibility

Run the test script to verify the function is accessible:

```bash
# Update the supabaseKey in test-social-posting.js with your actual anon key
node test-social-posting.js
```

## 🔍 Troubleshooting

### Common Issues:

1. **"Invalid access token"**
   - Make sure you're using a Page Access Token, not a User Access Token
   - Ensure the token has the correct permissions

2. **"Instagram account not found"**
   - Verify your Instagram Business Account ID is correct
   - Ensure your Instagram account is connected to a Facebook Page

3. **"Permission denied"**
   - Check that your Facebook App has Instagram Basic Display permissions
   - Verify your app is in "Live" mode (not development)

4. **"Function not found"**
   - Deploy the social-poster function to Supabase:
   ```bash
   npx supabase functions deploy social-poster
   ```

## 📝 Current Status

- ✅ **Frontend UI**: Complete and functional
- ✅ **Backend Function**: Implemented and deployed
- ❌ **Instagram Credentials**: Need to be configured
- ❌ **Real Posting**: Not working until credentials are set up

## 🎯 Next Steps

1. **Set up Instagram Business Account** (if you haven't already)
2. **Follow the credential setup steps** above
3. **Update the code** with your real credentials
4. **Test with a real post** to your Instagram account

## 🔒 Security Note

**Never commit real credentials to version control!** Consider using environment variables or a secure configuration system for production.

---

**The function is working correctly - it just needs proper Instagram API credentials to actually post to your Facebook/Instagram account.** 