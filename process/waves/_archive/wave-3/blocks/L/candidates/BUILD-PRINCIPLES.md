1. Boot the production-built artifact in a prod-like container and exercise its runtime config before merge.
   Why: Config and build-arg defects pass local and CI green but surface only on first prod boot.
