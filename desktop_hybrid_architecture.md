# Q-worship Hybrid Local-First Architecture

# Overview

Q-worship is transitioning from a traditional cloud-dependent web application into a high-performance Offline-First Desktop Application (using a native desktop wrapper like Electron or Tauri).

To ensure the "Hands-Free Bible" and media projection features have 0ms latency and work completely offline (e.g., during a Sunday service with no Wi-Fi), we are adopting a Hybrid Local-First Data Architecture. This document serves as the permanent reference for this offline-first strategy.

## 1. The Architectural Split

System data is strictly segregated into two layers based on latency constraints and network dependency requirements.

### A. The Cloud Data Layer (Remote API / MongoDB Atlas)

The centralized cloud server is only responsible for data that inherently requires internet access.

Authentication: Login credentials, JWT token generation, and role/permission checks.
Billing & Licensing: Subscription management and feature gating.
Telemetry: Error logging and usage statistics across platforms.
Cloud Sync Backups: Background synchronization of the user's custom songs and saved media playlists. This ensures their creative data is safe if their local machine fails, allowing seamless cross-device login.

### B. The Local Data Layer (Offline Desktop Database)

This is a lightweight, ultra-fast database that physically resides on the user's hard drive inside the Desktop Application wrapper. The React FSD frontend interacts with this layer instantly, bypassing the network completely.

Heavy Static Data: The complete texts of all supported Bible translations and deeply indexed reference maps.
Real-time Projection: All caching and retrieval for Hands-Free Bible queries, ensuring speech-to-text resolution is visually instantaneous.
User State: Local customized lists, immediate UI layout preferences, and locally cached background media files.

## 2. Technical Stack Progression

To maintain our FSD Modular architecture without bloat, we will phase the database engine in gradually:

Phase 1: Browser Web App (The Current Transition phase)
Before the Desktop wrapper is finalized, the browser deployment will heavily simulate the "Local Database" behavior using IndexedDB.

# Engine: Dexie.js or standard localForage.

Flow:
On first login, the web app triggers an initial sync request from the Cloud MongoDB API, downloading the core Bible translation data in an optimized chunk.
The data is parsed and stored persistently in the browser's IndexedDB.
All subsequent queries (e.g., "John 3:16") are intercepted by the local UI data layer and retrieved from IndexedDB with 0ms network latency.
Phase 2: Native Desktop App (Final Target System)
Once packaged in Electron or Tauri, the local browser database is seamlessly swapped out for a fully native local database engine directly interacting with the host OS file system.

Engine: Embedded SQLite database bundled tightly into the native Main Process wrapper.
Flow:
The React FSD UI (Renderer Process) dispatches an IPC (Inter-Process Communication) event to the internal native backend requesting a Bible verse.
The internal native process executes a lightning-fast SELECT query against the local .sqlite file on the SSD.
The result is returned instantly to the React UI via IPC overhead (typically <2ms).

# 3. Data Synchronization Workflow

The system guarantees that the user can run a 6-hour Sunday service completely offline, while guaranteeing their local structural changes are eventually backed up to the cloud without manual user intervention.

# First-Time Setup (Online Required):

A church media director authenticates via the Cloud API on a new computer.
The Desktop application pulls down any missing Bible translations or licensed custom media and seamlessly populates the Local SQLite DB.
Live Worship Service (Offline Operation):
The church internet connection crashes or is purposely disabled to save bandwidth.
The user opens Q-worship. The local app validates the unexpired, cached JWT token and grants immediate UI access.
The Hands-Free Bible queries execute locally against the SSD SQLite database for zero-latency presentation projection.
Background Syncing (Online Reconnection):
When the internet is restored on Monday, a background sync worker process spins up. It detects locally created entities (newly arranged custom songs, modified service playlists).
These structural changes are safely pushed directly to the Cloud MongoDB layer via REST API calls, ensuring the user's creative intellectual property is highly available across their other licensed machines.
