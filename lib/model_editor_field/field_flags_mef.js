/**
 * The Field Flags field type
 *
 * @author   Jelle De Loecker   <jelle@codedor.be>
 * @since    0.0.1
 * @version  0.0.1
 */
alchemy.create('ModelEditorField', function FieldFlagsMEF() {

	this.input = function input(callback) {

		var linkedValues,
		    linkedModel,
		    linkedField,
		    linkedName,
		    fields,
		    flags,
		    key;
		
		this.fieldView = 'field_flags';

		linkedField = this.fieldConfig.linked;
		linkedName = this.record[linkedField];
		linkedValues = this.context[String(linkedField).pluralize()];
		flags = this.context.flags;

		// Get the linked model, where the fields should be fetched from
		linkedModel = Model.get(linkedName);

		fields = {};

		for (key in linkedModel.blueprint) {
			fields[key] = true;
		}

		// @todo: fix issue with JSON-Dry
		var v = alchemy.cloneSafe(this.value);

		this.value = {
			value: v,
			fields: fields,
			flags: flags
		};

		callback();
	};


	/**
	 * Modify the return value before saving
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 */
	this.save = function save(callback) {

		var value = this.value,
		    flag,
		    key;

		for (key in value) {
			for (flag in value[key]) {
				if (Array.isArray(value[key][flag])) {
					value[key][flag] = true;
				} else {
					value[key][flag] = false;
				}
			}
		}

		callback();
	};

});