#!/bin/bash
#####################################################
# Interactive script for managing Hestia Web Portal #
#####################################################
# Formatting Tips:
# https://misc.flogisoft.com/bash/tip_colors_and_formatting
# 
# Formatting:
# \e[1m - Bold
# \e[2m - Dim
# \e[8m - Hidden (passwords)
#
# Reset:
# \e[0m - Reset All Attributes
# \e[21m - Reset Bold/Bright
# \e[22m - Reset Dim
# \e[28m - Reset Hidden
#
# Colors:
# \e[39m - Default Foreground Color
# \e[30m - Black
# \e[31m - Red
# \e[32m - Green
# \e[34m - Blue
#####################################################

# Some initial variables to work with
timestamp=$(date "+%Y%m%d_%H%M")
filename="backup_$timestamp.tar.gz"

# Initial Prompt
# Bash allows for linebreaks in string literals and will
#   break lines accordingly in the shell
echo -e "
[ Hestia Control Panel ]
  
This script is being run from: '$(pwd)'
Active Nodes: $(ps ax -o pid,user,command | grep 'node websvr.js' | grep -v grep)

Please enter an option from below:

  [1] Launch Hestia Web Portal
  [2] Quit Hestia Web Portal
  [3] View the logs
  [4] Update Hestia
  
  [0] Quit Control Panel"

# Wait for input
read -p "Option: " opt

# Execute the correct commands based on input.
case "$opt" in
	1)
		# Launch Hestia Web Portal
		clear
		echo "Launching Hestia Web Portal"
		nohup node main.js > log.txt &
		;;
	2)
		# Quit Hestia Web Portal
		clear
		echo "Quitting Hestia Web Portal Gracefully"
		touch quit
		;;
	3)
		# View logs
		clear
		less log.txt
		;;
	4)
		# Update Hestia
		git pull && ./hestia.sh
		;;
	0)
		# Exit the script
		clear
		echo "Quitting..."
		exit
		;;
	*)
		clear
		echo "Invalid Option!"
		;;
esac

exec ./hestia.sh
