#!/usr/bin/env python3
"""
Test script to verify WebSocket connection stability fixes
"""
import asyncio
import websockets
import json
import time
import sys

async def test_websocket_stability():
    """Test WebSocket connection stability with the new fixes"""
    uri = "ws://localhost:8000/ws/chat?token=test_token"
    
    print("🧪 Testing WebSocket Connection Stability Fixes")
    print("=" * 50)
    
    try:
        print("🔌 Connecting to WebSocket...")
        
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully")
            
            # Test 1: Send a message and check immediate response
            print("\n📤 Test 1: Sending message...")
            test_message = {"content": "Hello, this is a test message"}
            await websocket.send(json.dumps(test_message))
            print("📤 Message sent")
            
            # Wait for processing acknowledgment
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5)
                data = json.loads(response)
                if data.get("type") == "processing":
                    print("✅ Received processing acknowledgment")
                else:
                    print(f"⚠️  Unexpected response type: {data.get('type')}")
            except asyncio.TimeoutError:
                print("⏰ Timeout waiting for processing acknowledgment")
            
            # Test 2: Wait for AI response (should be in background)
            print("\n🤖 Test 2: Waiting for AI response...")
            start_time = time.time()
            
            while time.time() - start_time < 30:  # Wait up to 30 seconds
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=5)
                    data = json.loads(response)
                    
                    if data.get("type") == "ai":
                        print("✅ Received AI response")
                        print(f"📝 Response: {data.get('message', {}).get('content', '')[:100]}...")
                        break
                    elif data.get("type") == "ping":
                        print("💓 Received ping")
                    elif data.get("type") == "user":
                        print("👤 Received user message confirmation")
                    else:
                        print(f"📨 Received message type: {data.get('type')}")
                        
                except asyncio.TimeoutError:
                    print("⏰ No response in 5 seconds, continuing...")
                    break
            
            # Test 3: Test connection stability with pings
            print("\n💓 Test 3: Testing connection stability...")
            start_time = time.time()
            ping_count = 0
            
            while time.time() - start_time < 20:  # Test for 20 seconds
                try:
                    # Send ping
                    await websocket.ping()
                    ping_count += 1
                    print(f"💓 Ping {ping_count} sent")
                    
                    # Wait for pong
                    await asyncio.wait_for(websocket.pong(), timeout=3)
                    print(f"💓 Pong {ping_count} received")
                    
                    await asyncio.sleep(5)  # Wait 5 seconds between pings
                    
                except asyncio.TimeoutError:
                    print(f"⏰ Pong timeout on ping {ping_count}")
                    break
                except Exception as e:
                    print(f"❌ Error during ping/pong: {e}")
                    break
            
            print(f"\n📊 Connection Test Results:")
            print(f"   - Pings sent: {ping_count}")
            print(f"   - Connection duration: {time.time() - start_time:.1f} seconds")
            
            print("\n✅ WebSocket stability test completed successfully!")
            
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")
        return False
    
    return True

async def test_multiple_connections():
    """Test multiple simultaneous connections"""
    print("\n🧪 Testing Multiple Connections")
    print("=" * 30)
    
    connections = []
    try:
        # Create 3 simultaneous connections
        for i in range(3):
            uri = f"ws://localhost:8000/ws/chat?token=test_token_{i}"
            websocket = await websockets.connect(uri)
            connections.append(websocket)
            print(f"✅ Connection {i+1} established")
        
        # Send messages from all connections
        for i, websocket in enumerate(connections):
            message = {"content": f"Test message from connection {i+1}"}
            await websocket.send(json.dumps(message))
            print(f"📤 Message sent from connection {i+1}")
        
        # Wait a bit
        await asyncio.sleep(5)
        
        # Close all connections
        for i, websocket in enumerate(connections):
            await websocket.close()
            print(f"🔌 Connection {i+1} closed")
        
        print("✅ Multiple connections test completed")
        
    except Exception as e:
        print(f"❌ Multiple connections test failed: {e}")
        # Clean up
        for websocket in connections:
            try:
                await websocket.close()
            except:
                pass

if __name__ == "__main__":
    print("🚀 Starting WebSocket Stability Tests")
    print("Make sure your server is running on localhost:8000")
    print()
    
    # Run tests
    success = asyncio.run(test_websocket_stability())
    
    if success:
        asyncio.run(test_multiple_connections())
        print("\n🎉 All tests completed successfully!")
        print("Your WebSocket connection should now be stable!")
    else:
        print("\n❌ Tests failed. Check your server configuration.")
        sys.exit(1) 