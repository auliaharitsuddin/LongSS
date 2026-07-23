# PowerShell script to create simple placeholder icons
# These are temporary icons until proper ones are generated

$sizes = @(16, 32, 48, 128)

Add-Type -AssemblyName System.Drawing

foreach ($size in $sizes) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Enable anti-aliasing
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    # Create gradient background
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $color1 = [System.Drawing.Color]::FromArgb(255, 102, 126, 234)  # #667eea
    $color2 = [System.Drawing.Color]::FromArgb(255, 118, 75, 162)   # #764ba2
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $color1, $color2, 45)
    $graphics.FillRectangle($brush, $rect)
    
    # Draw camera body (white rectangle)
    $white = [System.Drawing.Color]::White
    $whiteBrush = New-Object System.Drawing.SolidBrush($white)
    $bodyX = [int]($size * 0.2)
    $bodyY = [int]($size * 0.35)
    $bodyW = [int]($size * 0.6)
    $bodyH = [int]($size * 0.4)
    $graphics.FillRectangle($whiteBrush, $bodyX, $bodyY, $bodyW, $bodyH)
    
    # Draw lens (circle)
    $purple = [System.Drawing.Color]::FromArgb(255, 102, 126, 234)
    $purpleBrush = New-Object System.Drawing.SolidBrush($purple)
    $lensSize = [int]($size * 0.25)
    $lensX = [int](($size - $lensSize) / 2)
    $lensY = [int]($size * 0.45)
    $graphics.FillEllipse($purpleBrush, $lensX, $lensY, $lensSize, $lensSize)
    
    # Save
    $outputPath = Join-Path $PSScriptRoot "icons\icon$size.png"
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    Write-Host "Created icon$size.png" -ForegroundColor Green
    
    # Cleanup
    $graphics.Dispose()
    $bitmap.Dispose()
    $brush.Dispose()
    $whiteBrush.Dispose()
    $purpleBrush.Dispose()
}

Write-Host "`nAll icons created successfully!" -ForegroundColor Cyan
Write-Host "Icons are located in the 'icons' folder" -ForegroundColor Cyan
