# Portfolio terminal

The Terminal / Regular view switch works in the computer and in `profile.html`. Commands read the same generated portfolio sections, so updates to `content/portfolio.json` update both views.

Commands: `help`, `about` (`whoami`, `bio`), `research`, `experience` (`work`, `cv`), `education`, `projects`, `skills`, `contact`, `links`, `clear`, and `regular` (`exit`, `gui`). `ls` aliases help. Tab completes a known command, up/down recalls history, and Ctrl+L clears output. Command history is kept only in memory for the current page.

This is a local portfolio navigator. Input is rendered as text and never evaluated as JavaScript or sent to a shell. No backend service is required. Output and history are bounded. The regular profile remains readable with JavaScript disabled.
