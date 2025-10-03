
# PDB RNA Viewer

## Building & Running locally
```JS
npm install
npm run build
npm run serve
```

## Build automatically on file save
```JS
npm run watch
```

## Plugin parameters (options)
|No.|Option|Value|Details|
|---|---|---|---|
|01|pdbeId|`string`|PDB ID - Example: '3l3c'|
|02|entityId|`string`|Entity ID - Example: '3'|
|03|chainId|`string`|Chain ID - Example: 'R'|
|04|subscribeEvents|`boolean`| Default - `false`|
|05|apiData|`ApiData`| Default - `undefined` |
|06|FR3DData|`JSON`| Default - `undefined` |

apiData and FR3DData are automatically retrieved using pdbeId, entityId and chainId if not set on options

See data examples at:
- APIData: https://www.ebi.ac.uk/pdbe/static/entry/7v08_4_3.json
- FR3DData: https://www.ebi.ac.uk/pdbe/static/entry/7v08_3_basepair.json

## Web app implementation
**Refer index.html and component.html for implementation example**