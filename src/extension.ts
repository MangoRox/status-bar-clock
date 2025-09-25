import * as vscode from 'vscode';

let myStatusBarItem: vscode.StatusBarItem;
let timerInterval: NodeJS.Timeout | undefined;
let remainingSeconds = 0;

export function activate({ subscriptions }: vscode.ExtensionContext) {


	const myCommandId = 'startTimer';

	// command that prompts for timer parameters
	subscriptions.push(vscode.commands.registerCommand(myCommandId, async () => {
		if (timerInterval) {
			const choice = await vscode.window.showInformationMessage(
				'A timer is already running. Replace it?',
				'Replace',
				'Cancel timer',
				'Keep'
			);
			if (!choice || choice === 'Keep') {
				return; // do nothing
			}
			if (choice === 'Cancel timer') {
				stopTimer();
				vscode.window.showInformationMessage('Timer cancelled.');
				return;
			}
			// if user chose replace, continue...
		}
		// prompt for new timer values
		async function getHours() {
			const input = await vscode.window.showInputBox({
				placeHolder: 'Hours (e.g. 1)',
				validateInput: (value) => {
					if (!/^[0-9]*$/.test(value)) {
						return 'Please enter a non-negative integer';
					}
					return null;
				}
			});
			if (input === undefined) {
				// user exited the input box
				return undefined;
			}
			return parseInt(input, 10);
		};

		const hours = await getHours();
		if (hours === undefined) { return; }

		async function getMinutes() {
			let n = 0;
			const input = await vscode.window.showInputBox({
				placeHolder: 'Minutes (0-59)',
				validateInput: (value) => {
					if (!/^[0-9]*$/.test(value)) {
						return 'Please enter a non-negative integer between 0 and 59';
					}
					n = parseInt(value, 10);
					if (n < 0 || n > 59) {
						return 'Please enter a non-negative integer between 0 and 59';
					}
					return null;
				}
			});
			if (input === undefined) {
				// exited the input box
				return undefined;
			}
			return n;
		}
		const minutes = await getMinutes();
		if (minutes === undefined) { return; }

		async function getSeconds() {
			let n = 0;
			const input = await vscode.window.showInputBox({
				placeHolder: 'Seconds (0-59)',
				validateInput: (value) => {
					if (!/^[0-9]*$/.test(value)) {
						return 'Please enter a non-negative integer between 0 and 59';
					}
					n = parseInt(value, 10);
					if (n < 0 || n > 59) {
						return 'Please enter a non-negative integer between 0 and 59';
					}
					return null;
				}
			});
			if (input === undefined) {
				// user exited the input box
				return undefined;
			}
			return n;
		}
		const seconds = await getSeconds();
		if (seconds === undefined) { return; }

		const totalSeconds = Math.max(0, (hours * 3600) + (minutes * 60) + seconds);
		if (totalSeconds == 0) {
			vscode.window.showInformationMessage('Please enter a duration greater than zero.');
			return;
		}

		startTimer(totalSeconds);
		vscode.window.showInformationMessage(`Timer started: ${formatSecondsToHMS(totalSeconds)}`);
	}));

	// create a new status bar item that we can now manage
	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

	// clicking the status bar will invoke the timer prompt command
	myStatusBarItem.command = myCommandId;
	subscriptions.push(myStatusBarItem);

	// update status bar item every second
	setInterval(updateStatusBarItem, 1000);
}

function updateStatusBarItem(): void {
	// if: the timer is on, show the duration left in the timer. Otherwise -> show curr time
	if (remainingSeconds > 0) {
		myStatusBarItem.text = `$(clock) Timer: ${formatSecondsToHMS(remainingSeconds)}`;
	} else {
		const now = new Date();
		const currTimeString = now.toLocaleTimeString();
		myStatusBarItem.text = `${currTimeString}`;
		myStatusBarItem.color = undefined;
	}
	myStatusBarItem.show();
}

function startTimer(totalSeconds: number): void {
	// stop any existing timer if any and create start new interval for updating the timer.
	stopTimer();
	remainingSeconds = totalSeconds;
	timerInterval = setInterval(() => {
		remainingSeconds -= 1;
		if (remainingSeconds <= 0) {
			stopTimer();
			vscode.window.showInformationMessage('Timer finished!');
		}
	}, 1000);
}

function stopTimer(): void {
	// timer stop logic
	if (timerInterval) {
		clearInterval(timerInterval);
		timerInterval = undefined;
	}
	remainingSeconds = 0;
}

function formatSecondsToHMS(totalSeconds: number): string {
	// formats the seconds into a H:MM:SS string with padding in the tens place for single digit values
	const hrs = Math.floor(totalSeconds / 3600);
	const mins = Math.floor((totalSeconds % 3600) / 60);
	const secs = totalSeconds % 60;
	const h = String(hrs).padStart(2, '0');
	const m = String(mins).padStart(2, '0');
	const s = String(secs).padStart(2, '0');
	return `${h}:${m}:${s}`;
}

// function getNumberOfSelectedLines(editor: vscode.TextEditor | undefined): number {
// 	let lines = 0;
// 	if (editor) {
// 		lines = editor.selections.reduce((prev, curr) => prev + (curr.end.line - curr.start.line), 0);
// 	}
// 	return lines;
// }
