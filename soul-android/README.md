# Soul Android

Android 16 companion layer for the Soul project.

This directory is intentionally isolated from the existing web application. The Android implementation will be built incrementally, beginning with the perception/context foundation and later adding memory, prediction, reasoning, guardian, action graph, capabilities and learning.

Architecture baseline: `SystemEventCollector -> SoulEventBus -> SoulContextEngine -> SoulContext -> Cockpit`.
