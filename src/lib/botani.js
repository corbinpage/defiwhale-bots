function startTask(subject, message) {
	const order = message.taskHistory.length + 1
	message.taskHistory.push({
		subject: subject,
		order: order,
		startedAt: Date.now()
	})

	console.log(`Task #${order}: ${subject}`)

	return message
}

function finishTask(subject, message) {
	// Save message and task history

	// addToQueue(subject, message)
}

module.exports = {startTask, finishTask}