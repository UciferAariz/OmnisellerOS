# OmniSeller OS

One desktop-style operating system for sellers who manage products, orders, inventory, invoices, and customer messages across marketplaces.

## Architecture

```text
Shell (desktop, taskbar, app windows)
        |
Kernel (plain-English request router)
        |
Apps (orders, inventory, invoices, replies)
        |
Connectors (one standard adapter per marketplace)
        |
Local mock data (SKUs, orders, messages)
```

All marketplace connectors use local mock data for the hackathon demo. Real seller APIs can later replace connector data sources without changing the shell, kernel, or apps.

## Run locally

Open `index.html` in a browser, or serve this folder with any static-file server. No backend or external API is required.

## Verify the demo flow

Run `npm.cmd run test` on Windows. The integration check runs the full demo: unified orders, Amazon-to-all-marketplaces stock sync, GST invoice generation, and a 1-star Meesho reply.

## Project layout

```text
shell/        OS shell and window management
kernel/       Request router
connectors/   Marketplace connector contract and adapters
apps/         Order inbox, inventory, invoice, and replies apps
data/         Local mock SKU, order, and review data
pitch/        Presentation and demo materials
```
