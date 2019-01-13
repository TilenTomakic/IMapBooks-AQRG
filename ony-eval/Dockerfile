FROM python:3

WORKDIR /usr/src/app

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN ls -al
RUN chmod +x run_tests.sh

CMD [ "./run_tests.sh" ]


