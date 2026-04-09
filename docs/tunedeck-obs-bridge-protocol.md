# TuneDeck OBS Bridge Protocol

This document defines the first bridge contract between the TuneDeck app and the future **TuneDeck OBS** plugin.

## Goal

TuneDeck keeps local playback active and prepares a second output path for OBS.

## Architecture

TuneDeck UI  
-> Player Adapter  
-> Local Player  
-> Broadcast Bridge  
-> TuneDeck OBS plugin

## Transport Plan

Planned transport for the first native implementation:

- command channel: named pipe
- audio channel: shared memory ring buffer
- status channel: named pipe events

## Command Messages

```json
{ "type": "bridge.ping" }
{ "type": "bridge.connect" }
{ "type": "bridge.disconnect" }
{ "type": "track.play", "trackId": "abc", "title": "Song", "url": "https://..." }
{ "type": "track.pause" }
{ "type": "track.resume" }
{ "type": "track.stop" }
{ "type": "track.seek", "seconds": 32.5 }
{ "type": "track.volume", "value": 0.72 }
```

## Status Messages

```json
{
  "type": "status",
  "bridgeReady": true,
  "pluginConnected": false,
  "localOutputReady": true,
  "broadcastOutputReady": false,
  "sampleRate": 48000,
  "channels": 2,
  "mode": "dual-output-prep"
}
```

## Audio Format Target

- sample rate: 48000 Hz
- channels: stereo
- format: float32 PCM

## v0.8.0 Scope

v0.8.0 does not ship the final OBS plugin yet.  
This build only establishes the bridge-ready structure inside TuneDeck so the OBS plugin can be developed against a stable app-side contract.
