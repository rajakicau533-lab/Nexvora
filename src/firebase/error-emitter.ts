'use client';

/**
 * @fileOverview Pemancar error global untuk menangkap error keamanan Firestore.
 */

type ErrorMap = {
  'permission-error': (error: any) => void;
};

class ErrorEmitter {
  private listeners: { [K in keyof ErrorMap]?: ErrorMap[K][] } = {};

  on<K extends keyof ErrorMap>(event: K, listener: ErrorMap[K]) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
  }

  emit<K extends keyof ErrorMap>(event: K, ...args: Parameters<ErrorMap[K]>) {
    this.listeners[event]?.forEach((listener) => listener(...args));
  }
}

export const errorEmitter = new ErrorEmitter();
