In order to use the Docker container for the Mosquitto MQTT server, you must run the following command(s).

Build container:

```bash
docker build . -t mosquitto-dev:v1
```

Run container:

```bash
docker run -it --rm -p 1883:1883 mosquitto-dev:v1
```

This will start a new container, and run it on port 1883. When you press `Ctrl+C` it will end the process and remove the container.

**Note**: DO **NOT** USE THIS FOR **PRODUCTION**! **DEVELOPMENT USE ONLY!**