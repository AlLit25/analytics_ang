import { Component, HostListener, signal } from '@angular/core';
import { Balance } from '../screen/balance/balance';
import { Detail } from '../screen/detail/detail';
import { Verify } from '../screen/verify/verify';
import { AddTransaction } from '../screen/add-transaction/add-transaction';

type TabName = 'balances' | 'add' | 'detail' | 'verify';

@Component({
  selector: 'app-main',
  imports: [Balance, Detail, AddTransaction, Verify],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {
  private readonly tabs: TabName[] = ['balances', 'add', 'detail', 'verify'];
  private readonly swipeThreshold = 60;
  private readonly swipeCooldownMs = 350;

  private touchStartX = 0;
  private touchStartY = 0;
  private isTracking = false;
  private lastSwipeTime = 0;

  protected activeTab = signal<TabName>('balances');

  setTab(tabName: TabName) {
    this.activeTab.set(tabName);
  }

  @HostListener('document:touchstart', ['$event'])
  onDocumentTouchStart(event: TouchEvent) {
    if (event.touches.length !== 1) {
      this.isTracking = false;
      return;
    }

    const target = event.target as HTMLElement | null;
    if (!target || target.closest('.bottom-nav')) {
      this.isTracking = false;
      return;
    }

    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.isTracking = true;
  }

  @HostListener('document:touchend', ['$event'])
  onDocumentTouchEnd(event: TouchEvent) {
    if (!this.isTracking) {
      return;
    }
    this.isTracking = false;

    const now = Date.now();
    if (now - this.lastSwipeTime < this.swipeCooldownMs) {
      return;
    }

    const touch = event.changedTouches[0];
    if (!touch) {
      return;
    }

    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;

    if (Math.abs(deltaY) > Math.abs(deltaX) || Math.abs(deltaX) < this.swipeThreshold) {
      return;
    }

    const currentIndex = this.tabs.indexOf(this.activeTab());
    if (currentIndex === -1) {
      return;
    }

    const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= 0 && nextIndex < this.tabs.length) {
      this.lastSwipeTime = now;
      this.activeTab.set(this.tabs[nextIndex]);
    }
  }

  @HostListener('document:touchcancel')
  onDocumentTouchCancel() {
    this.isTracking = false;
  }
}
