5. Assert a nonzero executed-count from the CI integration job log; a green exit with zero specs run is a false-green.
   Why: A stripped env var makes the integration tier skip all specs yet still exit the job green.
