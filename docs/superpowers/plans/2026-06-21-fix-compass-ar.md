# Fix Compass & AR Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix DeviceOrientation compass permissions on iOS and Android so the AR arrow shows the correct heading.

**Architecture:** Two surgical edits. In `ar/page.tsx`, request iOS orientation permission *before* awaiting camera (keeps gesture context), and unmount ARArrow guard from `hasCamera` to `hasPermission`. In `ARArrow.tsx`, use a closure flag to prefer `deviceorientationabsolute` (true compass) over `deviceorientation` (relative-to-initial) on Android.

**Tech Stack:** Next.js 14 App Router, DeviceOrientation API, MediaDevices API

## Global Constraints

- No new dependencies.
- No test suite — verification is manual in a mobile browser (see each task's test steps).
- TypeScript strict mode; no `any` beyond existing patterns.
- Ponytail: shortest working diff wins.

---

### Task 1: Fix permission order and decouple ARArrow from camera

**Files:**
- Modify: `src/app/v/[venueId]/ar/page.tsx`

**Problem:**
On iOS 13+, `DeviceOrientationEvent.requestPermission()` must be called synchronously within a user-gesture handler. The current code `await getUserMedia()` before calling `requestPermission()`, so by the time the orientation call runs iOS has discarded the gesture context → compass permission dialog never appears.

Additionally, `ARArrow` is gated on `{hasCamera && <ARArrow .../>}` so if camera access fails the compass arrow never mounts, even though compass can work without a camera feed.

**Fix:**
1. Move `DOE.requestPermission()` to be the very first thing in `requestPermissions()`, before any `await`.
2. Add `hasPermission` state (true once `requestPermissions()` completes).
3. Gate `ARArrow` on `hasPermission` instead of `hasCamera`.

- [ ] **Step 1: Replace `requestPermissions` and add `hasPermission` state**

Replace `src/app/v/[venueId]/ar/page.tsx` lines 20–72 with:

```tsx
  const [needsPermission, setNeedsPermission] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const watcherRef = useRef<number | null>(null);

  // Check if iOS requires explicit permission
  useEffect(() => {
    const DOE = DeviceOrientationEvent as any;
    if (typeof DOE.requestPermission === 'function') {
      setNeedsPermission(true);
    } else {
      requestPermissions();
    }
    return () => stopAR();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function requestPermissions() {
    setNeedsPermission(false);

    // ponytail: orientation MUST be requested first on iOS — gesture context expires after first await
    try {
      const DOE = DeviceOrientationEvent as any;
      if (typeof DOE.requestPermission === 'function') {
        await DOE.requestPermission();
      }
    } catch {}

    // Camera (optional — AR arrow works without it)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCamera(true);
    } catch (err: any) {
      setCameraError(err?.message || 'Sin permiso de cámara');
    }

    setHasPermission(true);

    // GPS
    if (navigator.geolocation) {
      watcherRef.current = navigator.geolocation.watchPosition(
        (pos) => setGpsAccuracy(Math.round(pos.coords.accuracy)),
        () => setGpsAccuracy(null),
        { enableHighAccuracy: true, maximumAge: 1000 }
      );
    }
  }
```

- [ ] **Step 2: Gate ARArrow on `hasPermission`, update status text**

In the JSX section (around line 123 and line 137), make two changes:

Change line 123:
```tsx
      {hasCamera && <ARArrow targetBearing={targetBearing} />}
```
to:
```tsx
      {hasPermission && <ARArrow targetBearing={targetBearing} />}
```

Change line 137 (status text inside the top bar):
```tsx
            {hasCamera ? 'Modo AR activo' : 'Iniciando…'}
```
to:
```tsx
            {hasCamera ? 'Modo AR activo' : hasPermission ? 'Brújula activa' : 'Iniciando…'}
```

- [ ] **Step 3: Verify it builds**

```bash
cd /home/negrura/Escritorio/aqui-app && npm run build 2>&1 | tail -20
```

Expected: exits 0. If TypeScript errors appear, fix them before committing.

- [ ] **Step 4: Manual test — iOS Safari**

On an iPhone (iOS 13+), navigate to `/v/demo/ar?from=entrance&to=cafeteria` (or any valid route). Expected behavior:
1. "Permisos necesarios" overlay appears.
2. Tap "Conceder permisos" → iOS shows compass permission dialog first, then camera permission.
3. Arrow appears and rotates as you turn the phone.

If you only see the camera dialog and compass never appears, the fix didn't work — double-check step 1 ordering.

- [ ] **Step 5: Manual test — Android Chrome**

On an Android phone in Chrome, navigate to the same AR URL. Expected behavior:
1. No permission overlay (Android doesn't require explicit `requestPermission`).
2. Arrow appears within ~1 second.
3. Arrow rotates smoothly as you turn — NOT just as you tilt.

- [ ] **Step 6: Manual test — camera denied**

On either device, deny camera permission when prompted. Expected behavior:
- Camera error banner appears ("No se pudo abrir la cámara").
- Arrow STILL appears and compass still works (dark background instead of camera feed).

- [ ] **Step 7: Commit**

```bash
git add src/app/v/\[venueId\]/ar/page.tsx
git commit -m "fix: request iOS compass permission before camera await, decouple ARArrow from hasCamera"
```

---

### Task 2: Prefer absolute compass on Android

**Files:**
- Modify: `src/components/ARArrow.tsx`

**Problem:**
On Android Chrome, both `deviceorientationabsolute` (true north, correct) and `deviceorientation` (relative to initial orientation, wrong for compass) fire and call the same handler. Since `deviceorientation` fires frequently and sometimes last, the relative value overwrites the absolute heading — the arrow drifts as the page loads from different orientations.

**Fix:**
Use a closure-local `gotAbsolute` flag. When `deviceorientationabsolute` fires, set it. When `deviceorientation` fires, skip if `gotAbsolute` is already true.

- [ ] **Step 1: Replace the `useEffect` in `ARArrow.tsx`**

Replace lines 23–54 (the entire useEffect) with:

```tsx
  useEffect(() => {
    let gotAbsolute = false;

    function handleOrientation(e: DeviceOrientationEvent) {
      // Prefer absolute compass; ignore relative deviceorientation once we have absolute
      if (e.type === 'deviceorientation' && gotAbsolute) return;
      if (e.type === 'deviceorientationabsolute') gotAbsolute = true;

      // iOS: webkitCompassHeading is true heading (0-360, CW from north)
      const webkitHeading = (e as any).webkitCompassHeading;
      let h: number;
      if (typeof webkitHeading === 'number') {
        h = webkitHeading;
      } else if (e.alpha !== null) {
        // deviceorientationabsolute: alpha is true compass heading (0=north, CW)
        h = 360 - e.alpha;
      } else {
        return;
      }
      setHeading(h);
      setHasOrientation(true);
    }

    const DOE = DeviceOrientationEvent as any;
    if (typeof DOE.requestPermission === 'function') {
      // iOS: permission already requested by parent page — just attach listener
      window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
      // Android: listen to both; absolute takes precedence via gotAbsolute flag
      window.addEventListener('deviceorientationabsolute' as any, handleOrientation, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('deviceorientationabsolute' as any, handleOrientation, true);
    };
  }, []);
```

- [ ] **Step 2: Verify it builds**

```bash
cd /home/negrura/Escritorio/aqui-app && npm run build 2>&1 | tail -20
```

Expected: exits 0.

- [ ] **Step 3: Manual test — Android compass accuracy**

On Android Chrome, open AR view. Slowly rotate the phone. Expected:
- Arrow rotates smoothly to track true north (not drift as you turn).
- "Esperando brújula…" badge disappears within 1-2 seconds.

If the arrow still drifts, open Chrome DevTools → Console and check if `deviceorientationabsolute` events appear. Some Android devices/browsers don't support it — in that case `gotAbsolute` stays false and `deviceorientation` fires as fallback (acceptable degradation).

- [ ] **Step 4: Commit**

```bash
git add src/components/ARArrow.tsx
git commit -m "fix: prefer deviceorientationabsolute over relative deviceorientation on Android"
```
