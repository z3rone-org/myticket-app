# MyTicket App

**This is a personal project of mine and not intended for general / wide-spread use.**

MyTicket is a prove of concept to show how you can build a simple web app that displays a QR code that could be used as 
a ticket for transportation. This would be a simple solution to have your QR code on an additional device as a backup in
case the primary device might run out of battery.

# How it works

When you visit the web app you find a simple page inspired by the designs of common e-ticket apps. The page includes
some editable text fields for detailed information and a central canvas where a QR code can be displayed. To change the
fields one can tap on them and enter custom information. The QR code chessboard placeholder can be replaced by a QR code
image that will be parsed into an array of black and white squares.

This project is a [Progressive Web App](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps), which means
that you can install it for offline usage via your browsers menu under *"add to homescreen"*.

The app is served as static webpage that requires no server-side processing. All data is stored in
[LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) on the client device.

I have my personal instance running under https://myticket-app.z3ro.one