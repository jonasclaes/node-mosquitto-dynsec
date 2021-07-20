FROM ubuntu:hirsute

# Install dependencies
RUN apt update && apt install -y git build-essential libssl-dev xsltproc docbook-xsl

WORKDIR /opt

# cJSON
RUN git clone https://github.com/DaveGamble/cJSON.git \
    && cd /opt/cJSON \
    && make all \
    && make install \
    && ldconfig

# Mosquitto
RUN git clone https://github.com/eclipse/mosquitto.git \
    && cd /opt/mosquitto \
    && make \
    && make install \
    && ldconfig \
    && useradd mosquitto \
    && mkdir /config \
    && mosquitto_ctrl dynsec init /config/dynamic-security.json admin-user admin \
    && cp /opt/mosquitto/mosquitto.conf /config/mosquitto.conf \
    && echo "plugin /usr/local/lib/mosquitto_dynamic_security.so" >> /config/mosquitto.conf \
    && echo "plugin_opt_config_file /config/dynamic-security.json" >> /config/mosquitto.conf \
    && echo "listener 1883" >> /config/mosquitto.conf \
    && chown mosquitto /config -R

EXPOSE 1883
USER mosquitto

CMD [ "mosquitto", "-c", "/config/mosquitto.conf" ]