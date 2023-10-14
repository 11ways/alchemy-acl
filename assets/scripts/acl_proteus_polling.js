(() => {
	let count = 0;
	let errors = 0;

	async function doProteusPoll() {
		count++;

		let status_wrapper = document.querySelector('.acl-login-polling-status'),
		    status_starting,
		    status_checking,
		    status_long,
		    status_fail,
		    status_success;

		if (status_wrapper) {
			status_starting = status_wrapper.querySelector('.status-starting');
			status_checking = status_wrapper.querySelector('.status-checking');
			status_long = status_wrapper.querySelector('.status-long');
			status_fail = status_wrapper.querySelector('.status-fail');
			status_success = status_wrapper.querySelector('.status-success');
		} else {
			status_starting = false;
			status_checking = false;
			status_long = false;
			status_fail = false;
			status_success = false;
		}

		function hideAllStatus() {
			status_starting.hidden = true;
			status_checking.hidden = true;
			status_long.hidden = true;
			status_fail.hidden = true;
			status_success.hidden = true;
		}

		hideAllStatus();

		if (count < 2) {
			status_starting.hidden = false;
		} else {
			status_checking.hidden = false;
		}

		let result;

		try {
			result = await alchemy.fetch('AclStatic#proteusPollLogin', {
				post: true
			});
		} catch (err) {
			hideAllStatus();
			errors++;
			status_fail.hidden = false;

			if (errors < 3) {
				await Pledge.after(3000);
				doProteusPoll();
			}

			return;
		}

		hideAllStatus();

		if (result.finished) {
			if (!result.success) {
				status_fail.hidden = false;
				alert('Your login session has failed. Try refreshing the page.');
				return;
			}

			status_success.hidden = false;

			let return_url = result.redirect;

			if (!return_url) {
				// Use the current url as the return url
				return_url = window.location.href;
			}

			window.location = return_url;

			return;
		} else {
			if (count > 5) {
				status_long.hidden = false;
			} else {
				status_starting.hidden = false;
			}
		}

		await Pledge.after(3000);

		doProteusPoll();
	}

	doProteusPoll();
})();