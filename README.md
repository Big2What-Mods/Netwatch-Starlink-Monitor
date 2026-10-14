<div align="center">

# NETWATCH — STARLINK MONITOR

### NIGHT CITY NODE · Big2What-Mods

![NetWatch Starlink Monitor — reference image](github%20ref%20pic.png)

**A Cyberpunk 2077-inspired Windows desktop dashboard for monitoring Starlink connectivity.**

**Human-directed · AI-assisted coding · Built on DaveyHert's open-source Dishylink**

</div>

---

## What is this?

**NetWatch Starlink Monitor** is a modified and rebranded version of **[Dishylink by DaveyHert](https://github.com/DaveyHert/Dishylink)**. It is **not** a wholly original application or a from-scratch implementation of Starlink monitoring.

Big2What-Mods customized the presentation and Windows desktop experience with a Night City-inspired dashboard, NetWatch branding, custom artwork and icons, system monitoring, and a Windows build workflow.

The source for this customized application is in the [`src/` directory](src/). The screenshot above is the project's reference image, not a guarantee that every telemetry feature is available on every system.

## Credits and development disclosure

| Contribution | Credit |
| --- | --- |
| Original application, Starlink monitoring foundation, and upstream source | **[DaveyHert / Dishylink](https://github.com/DaveyHert/Dishylink)** |
| Project direction, visual decisions, Windows testing, review and acceptance | **Big2What-Mods** |
| AI-assisted code changes, debugging support, and build procedures | **OpenAI ChatGPT**, under human direction |

**Yes, AI was used to write and modify code.** Big2What-Mods specified requirements, tested the application, inspected changes, and decided what to keep. The original Dishylink code and author are explicitly credited; neither the underlying application nor its capabilities are presented as invented by ChatGPT or Big2What-Mods.

This is an independent customization, **not an official release from DaveyHert, SpaceX, Starlink, CD PROJEKT RED, or the fictional NetWatch organization**.

## What the dashboard shows

The customized Windows interface brings together:

- Starlink connection status and connection telemetry
- Download/upload throughput and latency charts
- Daily data usage and event information
- Satellite link visualization
- Location and local weather display
- Windows system readings: CPU, GPU, RAM, VRAM, and local time
- Firmware/update status and quick tools
- System tray operation and a Windows installer workflow

Data availability depends on the connected Starlink hardware, permissions, supported services, and local system capabilities. Some readings or tools may be unavailable depending on configuration.

## Windows build

The project files are inside [`src/`](src/), not at this repository's top level.

1. Install a supported Node.js and npm environment on Windows.
2. Open the `src` directory.
3. Run `npm.cmd ci` to install dependencies from the lockfile.
4. Run `npm.cmd run pack:win` to compile and package the Windows application.
5. Look for the installer under `src/release/`.

Alternatively, use the included [`src/build.bat`](src/build.bat) Windows build launcher. Packaging success is not a substitute for testing the installed application.

**Security note:** Review the source, dependencies, and requested network access before running software that communicates with your local network or Starlink services. Do not commit personal telemetry, account credentials, tokens, or local collector recordings.

## Source, license, and attribution

The underlying Dishylink project is released under the **MIT License**. The original copyright notice is retained in [`src/LICENSE`](src/LICENSE):

**Copyright (c) 2026 daveyhert**

The MIT permission and copyright notices must remain included in copies or substantial portions of the software. Please retain the upstream attribution and review any separately licensed artwork, trademarks, and dependencies before redistribution.

Further upstream documentation remains in the source tree, including [`src/README.md`](src/README.md), [`src/PRIVACY.md`](src/PRIVACY.md), and [`src/SECURITY.md`](src/SECURITY.md).

## Visual identity

The Night City / Cyberpunk-inspired appearance is a fan-made visual treatment. References to Cyberpunk 2077, Night City, and NetWatch are thematic; they do not imply endorsement or affiliation.

---

<div align="center">

**Big2What-Mods · Built through human direction, iterative testing, and AI-assisted development.**



</div>
