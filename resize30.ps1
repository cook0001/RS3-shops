Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile('c:\Users\danie\Documents\shop tracker\icon_v3.png')
$bmp = New-Object System.Drawing.Bitmap 30, 30
$graph = [System.Drawing.Graphics]::FromImage($bmp)
$graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graph.DrawImage($src, 0, 0, 30, 30)
$bmp.Save('c:\Users\danie\Documents\shop tracker\icon_v4.png', [System.Drawing.Imaging.ImageFormat]::Png)
$graph.Dispose()
$bmp.Dispose()
$src.Dispose()
