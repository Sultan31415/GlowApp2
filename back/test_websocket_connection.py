#!/usr/bin/env python3
"""
Simple WebSocket connection test script
"""
import asyncio
import websockets
import json
import time

async def test_websocket_connection():
    """Test WebSocket connection stability"""
    uri = "ws://localhost:8000/ws/chat?token=test_token"
    
    try:
        print("🔌 Testing WebSocket connection...")
        
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully")
            
            # Send a test message
            test_message = {"content": "Hello, this is a test message"}
            await websocket.send(json.dumps(test_message))
            print("📤 Test message sent")
            
            # Wait for response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=10)
                print(f"📥 Received response: {response}")
            except asyncio.TimeoutError:
                print("⏰ Timeout waiting for response")
            
            # Keep connection alive for 30 seconds
            print("⏳ Keeping connection alive for 30 seconds...")
            start_time = time.time()
            
            while time.time() - start_time < 30:
                try:
                    # Send heartbeat
                    await websocket.ping()
                    print("💓 Ping sent")
                    
                    # Wait for pong
                    await asyncio.wait_for(websocket.pong(), timeout=5)
                    print("💓 Pong received")
                    
                    await asyncio.sleep(10)  # Wait 10 seconds between pings
                    
                except asyncio.TimeoutError:
                    print("⏰ Pong timeout - connection may be unstable")
                    break
                except Exception as e:
                    print(f"❌ Error during heartbeat: {e}")
                    break
            
            print("✅ WebSocket test completed")
            
    except Exception as e:
        print(f"❌ WebSocket connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket_connection()) 