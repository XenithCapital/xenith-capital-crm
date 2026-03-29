[System.Environment]::SetEnvironmentVariable('PATH', 'C:\Program Files\nodejs;' + [System.Environment]::GetEnvironmentVariable('PATH', 'Machine'))
$env:SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjdXJ4ZW9wdG55b3BibG9ibnN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDcyMTc3NSwiZXhwIjoyMDkwMjk3Nzc1fQ.E-HFbLp9nIrcFKgGQ5V5vvdjhfSjOfdpvbTBcEmGlOs'
$env:ADMIN_EMAIL = 'info@xenithcapital.co.uk'
$env:ADMIN_PASSWORD = '#bAh.2b#l74y'
$env:ADMIN_NAME = 'Szymon Wloch'
Set-Location 'D:\1. Xenith Capital\CRM'
& 'C:\Program Files\nodejs\node.exe' scripts/create-admin.mjs
