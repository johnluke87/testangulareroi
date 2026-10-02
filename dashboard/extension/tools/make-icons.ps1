# Genera le icone dell'estensione (PNG) con System.Drawing di Windows.
# Uso:  powershell -ExecutionPolicy Bypass -File tools\make-icons.ps1
# Disegno: quadrato arrotondato blu con una "finestra del browser" bianca e un "+" (= nuova scheda).

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot

function New-RoundedPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

function New-Icon([int]$size, [string]$file) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    # sfondo: quadrato arrotondato con sfumatura blu
    $bg = New-RoundedPath 0 0 $size $size ($size * 0.22)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point 0, 0),
        (New-Object System.Drawing.Point $size, $size),
        [System.Drawing.Color]::FromArgb(255, 59, 130, 246),
        [System.Drawing.Color]::FromArgb(255, 30, 64, 175))
    $g.FillPath($brush, $bg)

    $white = [System.Drawing.Color]::White
    if ($size -ge 32) {
        # finestra del browser: bordo bianco + barra in alto con una "scheda"
        $m = $size * 0.18
        $w = $size - 2 * $m
        $stroke = [Math]::Max(1.5, $size * 0.055)
        $pen = New-Object System.Drawing.Pen $white, $stroke
        $win = New-RoundedPath $m ($m + $size * 0.04) $w ($w - $size * 0.04) ($size * 0.08)
        $g.DrawPath($pen, $win)
        $barY = $m + $size * 0.04 + $size * 0.17
        $g.DrawLine($pen, $m, $barY, $m + $w, $barY)
        $tab = New-RoundedPath ($m + $size * 0.07) ($m + $size * 0.09) ($size * 0.22) ($size * 0.08) ($size * 0.03)
        $g.FillPath((New-Object System.Drawing.SolidBrush $white), $tab)
        $cx = $size / 2; $cy = $barY + ($m + $w - $barY) / 2 + $size * 0.02; $arm = $size * 0.13
    } else {
        $cx = $size / 2; $cy = $size / 2; $arm = $size * 0.28
    }

    # il "+" della nuova scheda
    $plusPen = New-Object System.Drawing.Pen $white, ([Math]::Max(2, $size * 0.09))
    $plusPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $plusPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($plusPen, $cx - $arm, $cy, $cx + $arm, $cy)
    $g.DrawLine($plusPen, $cx, $cy - $arm, $cx, $cy + $arm)

    $g.Dispose()
    $bmp.Save($file, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "creata $file"
}

foreach ($s in 16, 32, 48, 128) {
    New-Icon $s (Join-Path $root "src\icons\icon-$s.png")
}
# logo per la scheda dello store di Edge (300x300)
New-Item -ItemType Directory -Force (Join-Path $root 'store') | Out-Null
New-Icon 300 (Join-Path $root 'store\logo-300.png')
