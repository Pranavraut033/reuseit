# Features

## Implemented Features

### Mobile Application
- **Waste Identification**: On-device waste classification using TensorFlow Lite models with 84% mAP50 and 76% mAP50-95 accuracy
- **User Authentication**: Email/password, Google Sign-In, and phone verification
- **Community Marketplace**: Create and browse posts for giveaways and requests
- **Private Messaging**: Chat functionality for post-related communications
- **Event Management**: Create events and RSVP as participants
- **Location Services**: Find and manage recycling centers using Google Maps
- **Gamification**: Earn points and unlock badges for recycling activities
- **Push Notifications**: Real-time notifications via Firebase Cloud Messaging

### Backend API
- **GraphQL API**: Complete API for all mobile features using NestJS
- **Database**: MongoDB with Prisma ORM for data management
- **Authentication**: JWT-based auth with Firebase integration
- **Geospatial Queries**: Location-based searches using MongoDB geospatial indexes

### Machine Learning
- **Model Training**: Python utilities for training waste classification models using YOLOv8
- **Dataset Management**: Scripts for preparing and merging training datasets
- **Model Performance**: YOLO waste detection model with 84% mAP50, 76% mAP50-95, 81% precision, and 81% recall
- **Waste Categories**: Detects 8 categories (cardboard, glass, metal, paper, plastic, trash, biological, battery)
- **Model Size**: ~2.7 MB TFLite model optimized for mobile deployment

---

**Last Updated**: December 2025
