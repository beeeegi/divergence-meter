import * as THREE from 'three'

window.onload = () => {
	// setting up the scene
	const canvas = document.getElementById('three-canvas')
	const scene = new THREE.Scene()
	scene.background = new THREE.Color(0x000304)
	
	// setting up the camera
	const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
	
	// setting up the rendererrrrrrr
	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: true
	})
	renderer.setSize(window.innerWidth, window.innerHeight)
	
	// function to create number textures (inside of the nixie tubes)
	const createNumberTexture = (number) => {
		const canvas = document.createElement('canvas')
		canvas.width = 256
		canvas.height = 512
		const ctx = canvas.getContext('2d')
		
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		
		// some glows
		ctx.shadowColor = '#ff6600'
		ctx.shadowBlur = 25
		ctx.shadowOffsetX = 0
		ctx.shadowOffsetY = 0
		
		ctx.fillStyle = '#ff8800'
		ctx.font = `bold 360px "DS-Digital", "ZCOOL QingKe HuangYou", monospace`
		ctx.textAlign = 'center'
		ctx.textBaseline = 'middle'
		
		ctx.scale(1, 1.1)
		ctx.fillText(number, canvas.width / 2, canvas.height / 2.2)
		
		ctx.globalAlpha = 0.5
		ctx.shadowBlur = 10
		ctx.shadowColor = '#ff3300'
		ctx.fillText(number, canvas.width / 2, canvas.height / 2.2)
		
		ctx.globalAlpha = 0.7
		ctx.shadowBlur = 3
		ctx.shadowColor = '#ffffff'
		ctx.fillText(number, canvas.width / 2, canvas.height / 2.2)
		
		return new THREE.CanvasTexture(canvas)
	}
	
	// generating textures from 0 to 9 and ofc the .
	const numberTextures = {}
	'0123456789.'.split('').forEach(num => {
		numberTextures[num] = createNumberTexture(num)
	})
	
	// main class for handling anims and display
	class DivergenceMeter {
		constructor() {
			this.displays = []
			this.tubes = []
			this.currentValue = 1.048596
			this.targetValue = this.currentValue
			this.randomizing = false
			this.flickerStates = Array(7).fill(1)
			this.createDisplays()
		}
		
		// displaying tubes and numbers
		createDisplays() {
			const tubeGeometry = new THREE.CylinderGeometry(0.45, 0.45, 2, 32, 1, true)
			const tubeMaterial = new THREE.MeshPhysicalMaterial({
				color: 0xffffff,
				transparent: true,
				opacity: 0.15,
				roughness: 0.1,
				metalness: 0,
				clearcoat: 1,
				clearcoatRoughness: 0.1,
				side: THREE.DoubleSide
			})
			
			const capGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.1, 32)
			const capMaterial = new THREE.MeshPhysicalMaterial({
				color: 0x202020,
				metalness: 0.8,
				roughness: 0.2
			})
			
			// create 7 identical nixie tubes
			for (let i = 0; i < 7; i++) {
				const tubeGroup = new THREE.Group()
				
				// displaying number in the tube itself
				const display = new THREE.Mesh(
					new THREE.PlaneGeometry(0.7, 1.4),
					new THREE.MeshBasicMaterial({
						map: numberTextures['0'],
						transparent: true,
						opacity: 0.8,
						blending: THREE.AdditiveBlending,
						side: THREE.DoubleSide,
						depthWrite: false
					})
				)
				display.position.z = 0
				display.rotation.y = Math.PI / 2
				
				// glowing effects
				const glowGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.9, 32)
				const glowMaterial = new THREE.MeshBasicMaterial({
					color: 0xff3300, // Orange glow
					transparent: true,
					opacity: 0.03, // Low opacity for subtle glow
					blending: THREE.AdditiveBlending
				})
				const glow = new THREE.Mesh(glowGeometry, glowMaterial)
				
				// creating the tubes
				const tube = new THREE.Mesh(tubeGeometry, tubeMaterial.clone())
				tube.material.depthWrite = false
				
				// creating tube caps (like a bottle cap)
				const topCap = new THREE.Mesh(capGeometry, capMaterial)
				const bottomCap = new THREE.Mesh(capGeometry, capMaterial)
				topCap.position.y = 1
				bottomCap.position.y = -1
				
				// adding components to the tube's group
				tubeGroup.add(display)
				tubeGroup.add(glow)
				tubeGroup.add(tube)
				tubeGroup.add(topCap)
				tubeGroup.add(bottomCap)
				
				// positioning tubes with group
				tubeGroup.position.x = (i - 3) * 1.2
				
				this.tubes.push(tubeGroup)
				this.displays.push(display)
				scene.add(tubeGroup)
			}
		}
		
		// setting a new worldline
		setWorldLine(value) {
			this.targetValue = value
			this.randomizing = true
			
			// resetting randomizer
			setTimeout(() => {
				this.randomizing = false
			}, 1500)
		}
		
		// some flickering and an actual logic to change the numbers
		updateDisplay() {
			let valueStr
			if (this.randomizing) {
				// showing random values from 0.3 to 1.14 (anime based nums)
				const randomValue = 0.3 + Math.random() * (1.14 - 0.3)
				valueStr = randomValue.toFixed(6)
			} else {
				// shwoing final values
				valueStr = this.targetValue.toFixed(6)
			}
			
			this.displays.forEach((display, i) => {
				// randomizing flickering effect
				this.flickerStates[i] *= 0.95 + Math.random() * 0.05
				if (Math.random() < 0.02) this.flickerStates[i] = 0.9 + Math.random() * 0.1
				
				display.material.map = numberTextures[valueStr[i]]
				
				// opacity on flicker
				const baseOpacity = 0.8
				const randomFlicker = Math.random() * 0.1
				const sustainedFlicker = this.flickerStates[i]
				const sinFlicker = Math.sin(Date.now() * 0.005 + i * 1.5) * 0.05
				
				display.material.opacity =
				baseOpacity * sustainedFlicker +
				randomFlicker +
				sinFlicker
			})
		}
		
		// updating nixie tubes
		update(time) {
			this.updateDisplay()
			
			this.tubes.forEach((tube, i) => {
				tube.position.y = Math.sin(time * 0.001 + i) * 0.02
				tube.rotation.x = Math.sin(time * 0.001 + i) * 0.01
				tube.rotation.z = Math.sin(time * 0.001 + i * 0.5) * 0.01
				
				const display = this.displays[i]
				display.lookAt(camera.position)
			})
		}
	}
	
	// divergence meter obj
	const divergenceMeter = new DivergenceMeter()
	
	// lightning setup (im shit at it and idk how to do it properly ngl :D)
	const ambientLight = new THREE.AmbientLight(0x151515)
	scene.add(ambientLight)
	
	const frontLight = new THREE.PointLight(0xff6600, 1, 20)
	frontLight.position.set(0, 0, 5)
	scene.add(frontLight)
	
	const backLight = new THREE.PointLight(0x0099ff, 0.2, 20)
	backLight.position.set(0, 0, -5)
	scene.add(backLight)
	
	const rightLight = new THREE.PointLight(0xff6600, 0.5, 15)
	rightLight.position.set(5, 0, 2)
	scene.add(rightLight)
	
	const leftLight = new THREE.PointLight(0xff6600, 0.5, 15)
	leftLight.position.set(-5, 0, 2)
	scene.add(leftLight)
	
	// initial cam pos
	camera.position.z = 8
	
	// mouse movement
	const mouse = new THREE.Vector2()
	window.addEventListener('mousemove', (event) => {
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
		
		camera.position.x = mouse.x * 2.75
		camera.position.y = mouse.y * 2.25
		camera.lookAt(0, 0, 0)
	})
	
	// changing world lines when clicked
	window.addEventListener('click', () => {
		const worldLines = [
			1.048596,  // steins gate
			1.000000,  // alpha (kurisu's death)
			0.523299,  // luka
			0.571046,  // faris
			0.334581,  // mayushi
			1.130205,  // beta (mayushi's death)
			0.409431   // suzuha
		]
		
		const newValue = worldLines[Math.floor(Math.random() * worldLines.length)]
		divergenceMeter.setWorldLine(newValue)
	})
	
	// resizing event
	window.addEventListener('resize', () => {
		camera.aspect = window.innerWidth / window.innerHeight
		camera.updateProjectionMatrix()
		renderer.setSize(window.innerWidth, window.innerHeight)
	})
	
	// looping anim
	let time = 0
	const animate = () => {
		requestAnimationFrame(animate)
		time += 16
		
		divergenceMeter.update(time)
		
		frontLight.intensity = 0.8 + Math.sin(time * 0.001) * 0.1 + Math.random() * 0.05
		
		renderer.render(scene, camera)
	}
	
	animate()
}
