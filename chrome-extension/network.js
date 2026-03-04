/* ========================================
   NEON DRIFT — Network Stub (Offline Mode)
   No-op network manager for Chrome Extension
   Single-player only, no WebSocket needed
   ======================================== */

class NetworkManager {
    constructor() {
        this.playerId = null;
        this.hostId = null;
        this.connected = false;
        this.players = [];
        this.remotePlayers = new Map();
        this.isMultiplayer = false;
        this.callbacks = {};
        this.sendInterval = null;
    }

    connect() { /* Offline — no connection */ }
    send() { }
    joinRoom() { }
    updateCar() { }
    toggleReady() { }
    startRace() { }
    sendPosition() { }
    sendPowerupPicked() { }
    sendLapComplete() { }
    sendRaceFinished() { }
    returnToLobby() { }
    startSending() { }
    stopSending() { if (this.sendInterval) { clearInterval(this.sendInterval); this.sendInterval = null; } }
    interpolateRemotePlayers() { }

    on(event, fn) {
        if (!this.callbacks[event]) this.callbacks[event] = [];
        this.callbacks[event].push(fn);
    }
    emit(event, data) {
        if (this.callbacks[event]) this.callbacks[event].forEach(fn => fn(data));
    }

    get isHost() { return false; }
    get playerCount() { return 0; }
}

const network = new NetworkManager();
