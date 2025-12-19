import fs from 'fs';
import path from 'path';
import os from 'os';

const LOCK_FILE = path.join(os.tmpdir(), 'discord-bot-service.lock');

export function acquireLock(): boolean {
  try {
    // Check if lock file exists
    if (fs.existsSync(LOCK_FILE)) {
      // Read PID from lock file
      const pidStr = fs.readFileSync(LOCK_FILE, 'utf8').trim();
      const pid = parseInt(pidStr, 10);
      
      // Check if process with that PID is still running
      try {
        // On Unix systems, sending signal 0 to a process checks if it exists
        process.kill(pid, 0);
        // If we get here, process exists - another instance is running
        console.error(`❌ Another instance is already running (PID: ${pid})`);
        console.error(`   Lock file: ${LOCK_FILE}`);
        console.error(`   If you're sure no other instance is running, delete the lock file and try again.`);
        return false;
      } catch (error: any) {
        // Process doesn't exist (ESRCH = no such process)
        // Remove stale lock file
        fs.unlinkSync(LOCK_FILE);
        console.log(`🧹 Removed stale lock file (PID ${pid} no longer exists)`);
      }
    }
    
    // Create lock file with current PID
    fs.writeFileSync(LOCK_FILE, process.pid.toString(), 'utf8');
    console.log(`🔒 Lock acquired (PID: ${process.pid}, lock file: ${LOCK_FILE})`);
    
    // Clean up lock file on exit
    process.on('exit', () => {
      try {
        if (fs.existsSync(LOCK_FILE)) {
          fs.unlinkSync(LOCK_FILE);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    });
    
    process.on('SIGINT', () => {
      try {
        if (fs.existsSync(LOCK_FILE)) {
          fs.unlinkSync(LOCK_FILE);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      try {
        if (fs.existsSync(LOCK_FILE)) {
          fs.unlinkSync(LOCK_FILE);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
      process.exit(0);
    });
    
    return true;
  } catch (error) {
    console.error('Error acquiring lock:', error);
    return false;
  }
}


