$ErrorActionPreference = "Stop"

$container = "barbershop-postgres-local"

$existing = docker ps -a --filter "name=^/$container$" --format "{{.Names}}"
if ($existing -eq $container) {
  docker rm -f $container | Out-Null
  Write-Host "Stopped and removed $container" -ForegroundColor Green
} else {
  Write-Host "Container $container not found" -ForegroundColor Yellow
}
