
/**
 * The alchemy-permissions-editor element
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 */
const PermissionsEditor = Function.inherits('Alchemy.Element.Form.Base', 'PermissionsEditor');

if (!PermissionsEditor.setTemplateFile) {
	return;
}

/**
 * The template code
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 */
PermissionsEditor.setTemplateFile('elements/acl/permissions_editor');

/**
 * Getter for the table element
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 */
PermissionsEditor.addElementGetter('table_element', 'alchemy-table.pe-table');

/**
 * Get/set the value
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 */
PermissionsEditor.setProperty(function value(value) {

	let result = [],
	    rows = this.table_element.queryAllNotNested('tbody tr'),
		row;

	for (let i = 0; i < rows.length; i++) {
		row = rows[i];

		let fields = row.queryAllNotNested('alchemy-field'),
		    entry = {};

		for (let i = 0; i < fields.length; i++) {
			let field = fields[i],
			    val = field.value;
			
			if (typeof val == 'string') {
				val = val.trim();
			}

			entry[field.field_name] = val;
		}

		if (entry.permission) {
			result.push(entry);
		}
	}

	return result;
}, function setValue(value) {

	if (value && value instanceof Blast.Classes.Alchemy.Permissions.Permissions) {
		value = value.toArray();
	}

	this.assignData('value', value);
});

/**
 * Added to the DOM for the first time
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.8.0
 * @version  0.8.0
 */
PermissionsEditor.setMethod(function introduced() {

	let add_button = this.querySelector('.add-row');

	if (!add_button) {
		return;
	}

	add_button.addEventListener('click', e => {
		e.preventDefault();
		this.table_element.addDataRow();
	});
});
