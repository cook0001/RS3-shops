Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile('C:\Users\danie\.gemini\antigravity\brain\108db3e6-fbd5-498d-9543-d9a84e4ce737\rs3_shops_icon_1784400378304.jpg')
$bmp = New-Object System.Drawing.Bitmap 64, 64
$graph = [System.Drawing.Graphics]::FromImage($bmp)
$graph.DrawImage($src, 0, 0, 64, 64)
$bmp.Save('c:\Users\danie\Documents\shop tracker\icon_v3.png', [System.Drawing.Imaging.ImageFormat]::Png)
$graph.Dispose()
$bmp.Dispose()
$src.Dispose()