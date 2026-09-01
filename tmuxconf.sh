MY_SESSION=$(tmux list-sessions | grep "poeeconomy")
if [[ ! $MY_SESSION ]]; then
		# create a new session and `-d`etach
		tmux new-session -d -s poeeconomy
fi
tmux attach-session -d -t poeeconomy
