# pscontrolpanel
Node.js Raspberry Pi Pellet Stove Controller

# About
This project seeks to replace the OEM control panel on a Lennox Winslow PS40 pellet stove with a Raspberry Pi. I will be utilizing a Raspberry Pi Zero W, relays, and switches already installed on the pellet stove. I chose a Pi Zero W for its small form factor, the lack of pre-installed headers, its wireless connectivity, and familiarity with the platform. I had previously used an Arduino Nano for a much more rudimentary version of this project and found great difficulty in making adjustments to the code. Additionally the Raspberry Pi platform will allow for expansion in the future to include IoT controls and logging of usage utilizing networked databases. The project will be written using Node.js and the rpi-gpio Node module. I've chosen Node.js for its familiarity as well as ease of implementation of a web server for future expansion.

# GPIO
Three GPIO pins are used along with a common ground to control three relays, supplying 120VAC power to the igniter and combustion blower when appropriate, and supplying power to the auger motor in pulses. Two more GPIO pins are used to detect open/closed status of a temperature-controlled snap switch and a vacuum switch. Another temperature-controlled snap switch is used to supply power to the convection motor when the pellet stove has reached a suitable temperature. A final temperature-controlled snap switch us used to interrupt the circuit for the auger motor to shut the stove off when an over-temperature condition is met. I will be utilizing a OneWire DS18B20 temperature sensor to detect the temperature of air exiting the stove vents.

| Pi Pin | Function | Direction |
| ------:| -------- | --------- |
7 | Auger Relay | Out
13 | Igniter Relay | Out
15 | Combustion Blower Relay | Out
16 | Proof of Fire Switch | In
18 | OneWire Temp Sensor | In
22 | Vacuum Switch | In
4 | +5VDC for Switches | Out
6 | GND for Relays | In

# Oddities
For ease of adaption, connection, and prototyping I've decided to use Cat 5 ethernet cabling and RJ45 connectors to connect the Raspberry Pi to the stove, and to a breadboard mockup of the sensors and switches for testing.

# Environment Variables
* ONTIME - How long to turn the auger on, in milliseconds.  
* OFFTIME - How long to wait between turning the auger on, in milliseconds.  
* PAUSETIME - How long to pause when a `pause` file is detected, in milliseconds.  
* DEBUG - Displays extra log information when set to `true`

# Controls
* Run with `node main.js > log.txt &` to launch it in the background, piping output to a file `log.txt` which can be read from later.  
* Pause the script by creating a file named `pause` in the root directory.  
* Reload the environment variables by creating a file named `reload` in the root directory.  
* Quit the script by creating a file named `quit` in the root directory.