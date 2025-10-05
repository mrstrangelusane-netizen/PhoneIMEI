Add-Type -AssemblyName System.Drawing
$sizes = @(72,96,128,144,152,192,384,512)
New-Item -ItemType Directory -Force -Path icons | Out-Null
foreach ($s in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $s,$s
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::FromArgb(76,175,80))
    $fontSize = [int]([Math]::Max(24, [Math]::Floor($s/2.5)))
    $font = New-Object System.Drawing.Font('Segoe UI Emoji', $fontSize, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $brush = [System.Drawing.Brushes]::White
    $string = '📱'
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = 'Center'
    $sf.LineAlignment = 'Center'
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
    $g.DrawString($string, $font, $brush, [System.Drawing.RectangleF]::FromLTRB(0,0,$s,$s), $sf)
    $out = Join-Path 'icons' ("icon-$s.png")
    $bmp.Save($out,[System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Created $out"
}