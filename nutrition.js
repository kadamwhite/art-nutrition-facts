/* eslint-disable */// Align for readability.
const ingredients = [
	{ id: 'pretension', label: 'Pretension', unit: 'g',  dv: 50  },
	{ id: 'sincerity',  label: 'Sincerity',  unit: 'g',  dv: 50  },
	{ id: 'trauma',     label: 'Trauma',     unit: 'g',  dv: 25  },
	{ id: 'melancholy', label: 'Melancholy', unit: 'g',  dv: 30  },
	{ id: 'confusion',  label: 'Confusion',  unit: 'mg', dv: 200 },
].map( ( i ) => ( { ...i, type: 'ingredient' } ) );
const minerals = [
	{ id: 'activism',  label: 'Activism',     unit: 'g',  dv: 35  },
	{ id: 'tension',   label: 'Studiousness', unit: 'mg', dv: 150 },
	{ id: 'nostalgia', label: 'Nostalgia',    unit: 'mg', dv: 350 },
	{ id: 'whimsy',    label: 'Whimsy',       unit: 'g',  dv: 25  },
].map( ( m ) => ( { ...m, type: 'mineral' } ) );
/* eslint-enable */

const params = new URLSearchParams( window.location.search );
const formQueryParam = params.get( 'form' );

if ( formQueryParam ) {
	try {
		const savedProps = JSON.parse( formQueryParam );
		if ( savedProps ) {
			if ( savedProps?.title ) {
				document.getElementById( 'art-title' ).value = savedProps.title;
			}

			// Repopulate property arrays.
			ingredients.length = 0;
			minerals.length = 0;
			( savedProps?.properties || [] ).forEach( ( ingredient ) => {
				if ( ingredient.type === 'mineral' ) {
					minerals.push( ingredient );
				} else {
					ingredients.push( ingredient );
				}
			} );
		}
	} catch ( e ) {
		// Die silently in a ditch.
	}
}

const allProperties = [ ...ingredients, ...minerals ];
const propertyValues = Object.fromEntries(
	allProperties.map( ( n ) => [ n.id, 0 ] )
);

// Build slider rows
const rowsEl = document.getElementById( 'slider-rows' );
allProperties.forEach( ( n ) => {
	const row = document.createElement( 'div' );
	row.className = 'nutrient-row';
	row.innerHTML = `
		<div class="row-top">
			<span class="nutrient-label">${ n.label }</span>
			<span class="nutrient-value" id="v-${ n.id }">0</span>
		</div>
		<input type="range" min="0" max="100" value="${ n.value || 0 }" aria-label="${ n.label }">`;
	rowsEl.appendChild( row );

	const input = row.querySelector( 'input' );
	const valEl = document.getElementById( 'v-' + n.id );
	input.addEventListener( 'input', () => {
		propertyValues[ n.id ] = +input.value;
		valEl.textContent = input.value;
	} );
} );

let timeout = null;
document.addEventListener( 'click', ( evt ) => {
	const row = evt.target.closest( '.row' );
	if ( ! row ) {
		return;
	}
	if ( timeout && Date.now() < timeout ) {
		row.remove();
		return;
	}
	timeout = Date.now() + 500;
} );

const updateAndShowSaveButton = ( title ) => {
	const serializedState = encodeURIComponent(
		JSON.stringify( {
			title,
			properties: allProperties.map( ( ingredient, i ) => ( {
				...ingredient,
				value: propertyValues[ ingredient.id ],
			} ) ),
		} )
	);

	const saveUrl = new URL( window.location.href );
	saveUrl.search = `?form=${ serializedState }`;

	const saveLink = document.querySelector( '.save-link' );
	saveLink.href = saveUrl.toString();
	saveLink.style.display = 'inline-block';
}

document.getElementById( 'ok-button' ).addEventListener( 'click', () => {
	const title =
		document.getElementById( 'art-title' ).value.trim() || 'Untitled';
	const total = allProperties.reduce( ( s, n ) => s + propertyValues[ n.id ], 0 );

	const round = ( n ) =>
		Math.round( ( propertyValues[ n.id ] / 100 ) * n.dv ) + n.unit;
	const percent = ( n ) => propertyValues[ n.id ] + '%';

	const mineralsRendered = [];
	for ( let i = 0; i < minerals.length; i += 2 ) {
		const pair = minerals.slice( i, i + 2 );
		mineralsRendered.push( `<div class="small-row">
			${ pair
				.map(
					( n ) =>
						`<div class="mineral-label"><span contenteditable>${
							n.label
						}</span> <strong contenteditable>${ percent(
							n
						) }</strong></div>`
				)
				.join( '' ) }
		</div>` );
	}

	document.getElementById( 'rendered' ).innerHTML = `
	<div class="nutrition-facts">
		<div class="form-title">Art Facts</div>
		<div class="servings-per-container">${ '' /* Per artistic experience */ }</div>
		<div class="serving-size">
			<span>Serving size</span><span class="quantity" contenteditable>1 viewing</span>
		</div>
		<div class="bar-thick" /></div>
		<div class="per-serving" contenteditable>Amount per viewing</div>
		<div class="calories-row">
			<span class="calories-label" contenteditable>Intensity</span>
			<span class="calories-amt" contenteditable>${ total }</span>
		</div>
		<div class="bar-thin"></div>
		<div class="pct-dv">% Daily Value*</div>
		<div class="bar-medium"></div>
		${ ingredients
			.map(
				( n ) => `
			<div class="row">
				<div class="nutrient-row-left">
					<span class="nutrient-label" contenteditable>${ n.label }</span>
					<span class="nutrient-amt" contenteditable>${ round( n ) }</span>
				</div>
				<span class="nutrient-dv" contenteditable>${ percent( n ) }</span>
			</div>`
			)
			.join( '' ) }
		<div class="bar-thick"></div>
		${ mineralsRendered.join( '' ) }
		<div class="footer"><span contenteditable>*The % Daily Value (DV) tells you how much of this attribute a single viewing contributes to a daily aesthetic experience. ${
			'' /* 1,000 units is used for general art nutrition advice. */
		}</span><br><em contenteditable>${
			title === 'Untitled' ? '' : title
		}</em></div></div>`;

	document.getElementById( 'input-form' ).style.display = 'none';
	document.getElementById( 'rendered' ).style.display = 'block';

	updateAndShowSaveButton( title );

	window.scrollTo( 0, 0 );
} );
